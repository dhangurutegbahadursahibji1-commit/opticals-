import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import LensesTab from './LensesTab';
import AddOnsTab from './AddOnsTab';

export default function OpticalEnginePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Optical Engine</h1>
        <p className="text-gray-500 mt-1">Manage lenses, add-ons, and pricing rules.</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <NavLink
            to="lenses"
            className={({ isActive }) =>
              `whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            Lenses
          </NavLink>
          <NavLink
            to="add-ons"
            className={({ isActive }) =>
              `whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            Add-ons
          </NavLink>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <Routes>
          <Route path="/" element={<Navigate to="lenses" replace />} />
          <Route path="lenses" element={<LensesTab />} />
          <Route path="add-ons" element={<AddOnsTab />} />
        </Routes>
      </div>
    </div>
  );
}
