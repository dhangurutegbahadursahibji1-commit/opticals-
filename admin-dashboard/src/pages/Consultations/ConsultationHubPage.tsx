import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConsultations, updateConsultationStatus } from '../../api/client';
import { 
  RiCloseCircleLine,
  RiMagicLine 
} from 'react-icons/ri';
import toast from 'react-hot-toast';

const STATUS_COLUMNS = [
  { id: 'PENDING_REVIEW', label: 'Pending Review', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'CUSTOMER_CONTACTED', label: 'Contacted', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'CONFIRMED', label: 'Confirmed (Order)', color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'CANCELLED', label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' },
];

export default function ConsultationHubPage() {
  const queryClient = useQueryClient();
  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);

  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ['consultations'],
    queryFn: fetchConsultations,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => updateConsultationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      toast.success('Status updated');
      setSelectedConsultation(null);
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Group by status
  const grouped = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.id] = consultations.filter((c: any) => {
      // Treat any unmapped status as pending review for this simple view
      if (col.id === 'PENDING_REVIEW' && !['CUSTOMER_CONTACTED', 'CONFIRMED', 'CANCELLED'].includes(c.status)) return true;
      return c.status === col.id;
    });
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div>
      <div className="mb-6">
        <p className="text-muted">Manage incoming prescription reviews and expert assistance requests.</p>
      </div>

      <div className="flex overflow-x-auto pb-8 space-x-6 min-h-[600px]">
        {STATUS_COLUMNS.map(column => (
          <div key={column.id} className="flex-shrink-0 w-80 flex flex-col bg-surface-hover rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-semibold text-primary">{column.label}</h3>
              <span className="text-xs font-medium bg-white px-2 py-1 rounded-full text-muted border border-border">
                {grouped[column.id]?.length || 0}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {grouped[column.id]?.map((consultation) => (
                <div 
                  key={consultation.id} 
                  onClick={() => setSelectedConsultation(consultation)}
                  className={`bg-white p-4 rounded-xl shadow-sm border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer ${
                    selectedConsultation?.id === consultation.id ? 'ring-2 ring-primary border-transparent' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-muted">
                      {new Date(consultation.createdAt).toLocaleDateString()}
                    </span>
                    {consultation.commercialSnapshot?.lensConfig?.expertAssistance && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-sm flex items-center gap-1">
                        <RiMagicLine size={12} /> Expert
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-primary mb-1">{consultation.customerName || 'Anonymous Customer'}</h4>
                  <p className="text-sm text-muted line-clamp-1 mb-3">
                    {consultation.commercialSnapshot?.product?.name || 'Unknown Product'}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${column.color}`}>
                      {column.label}
                    </span>
                    {consultation.prescription && (
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-md border bg-purple-50 text-purple-700 border-purple-200">
                        Rx Included
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {(!grouped[column.id] || grouped[column.id].length === 0) && (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-border rounded-xl">
                  <span className="text-sm text-muted font-medium">No items</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Side Panel / Modal for Details */}
      {selectedConsultation && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setSelectedConsultation(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary">Consultation Details</h2>
              <button onClick={() => setSelectedConsultation(null)} className="p-2 hover:bg-surface rounded-full text-muted transition-colors">
                <RiCloseCircleLine size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Customer Info */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Customer</h3>
                <div className="bg-surface rounded-xl p-4">
                  <p className="font-medium text-primary">{selectedConsultation.customerName || 'N/A'}</p>
                  <p className="text-sm text-muted">{selectedConsultation.phone || 'N/A'}</p>
                  <p className="text-sm text-muted">{selectedConsultation.email}</p>
                </div>
              </section>

              {/* Product Info */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Product Configuration</h3>
                <div className="bg-surface rounded-xl p-4 space-y-2 text-sm text-primary">
                  <div className="flex justify-between">
                    <span className="text-muted">Frame:</span>
                    <span className="font-medium">{selectedConsultation.commercialSnapshot?.product?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Lens Selected:</span>
                    <span className="font-medium">{selectedConsultation.commercialSnapshot?.lensConfig?.lensTypeId || 'Expert Assistance Requested'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Customer Notes:</span>
                    <span className="font-medium text-right max-w-[200px]">{selectedConsultation.commercialSnapshot?.lensConfig?.customerNotes || 'None'}</span>
                  </div>
                </div>
                {selectedConsultation.commercialSnapshot?.pricing?.framePriceMismatch && (
                  <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg p-3">
                    ⚠ Price mismatch: customer's cart showed ₹{selectedConsultation.commercialSnapshot.pricing.framePrice}, but this product is currently priced at ₹{selectedConsultation.commercialSnapshot.pricing.verifiedFramePrice}. Double-check before confirming.
                  </div>
                )}
              </section>

              {/* Prescription */}
              {selectedConsultation.prescription && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Prescription</h3>
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <div className="grid grid-cols-3 gap-2 text-sm text-center mb-2">
                      <div className="font-semibold text-purple-900 border-b border-purple-200 pb-1">Eye</div>
                      <div className="font-semibold text-purple-900 border-b border-purple-200 pb-1">SPH</div>
                      <div className="font-semibold text-purple-900 border-b border-purple-200 pb-1">CYL</div>
                      
                      <div className="font-medium text-purple-800">Right (OD)</div>
                      <div>{selectedConsultation.prescription.sphereRight || '-'}</div>
                      <div>{selectedConsultation.prescription.cylinderRight || '-'}</div>
                      
                      <div className="font-medium text-purple-800">Left (OS)</div>
                      <div>{selectedConsultation.prescription.sphereLeft || '-'}</div>
                      <div>{selectedConsultation.prescription.cylinderLeft || '-'}</div>
                    </div>
                    {selectedConsultation.prescription.uploadedFileUrl && (
                      <a href={selectedConsultation.prescription.uploadedFileUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-purple-600 hover:underline mt-2 block text-center">
                        View Uploaded File
                      </a>
                    )}
                  </div>
                </section>
              )}
            </div>

            <div className="p-6 border-t border-border bg-surface">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Update Status</h3>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_COLUMNS.map(col => (
                  <button
                    key={col.id}
                    onClick={() => handleStatusChange(selectedConsultation.id, col.id)}
                    disabled={selectedConsultation.status === col.id || updateStatusMutation.isPending}
                    className={`p-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedConsultation.status === col.id 
                        ? 'bg-primary text-white border-primary cursor-default' 
                        : 'bg-white text-primary hover:bg-surface-hover border-border'
                    }`}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
