import type { FaceShape, FaceShapeAnalysis } from '../types';

// Local, predefined logic only — no network/AI call (rule #13). Landmarks come from
// MediaPipe FaceMesh running fully on-device; this function just classifies ratios.
export function classifyFaceShape(
  faceWidthMm: number,
  faceHeightMm: number,
  jawWidthMm: number,
  foreheadWidthMm: number
): FaceShapeAnalysis {
  const ratio = faceHeightMm / faceWidthMm;
  let faceShape: FaceShape;

  if (ratio > 1.5 && Math.abs(jawWidthMm - foreheadWidthMm) < 8) {
    faceShape = 'rectangle';
  } else if (ratio <= 1.1 && Math.abs(jawWidthMm - foreheadWidthMm) < 8) {
    faceShape = 'square';
  } else if (ratio <= 1.15 && jawWidthMm < foreheadWidthMm - 6) {
    faceShape = 'triangle';
  } else if (foreheadWidthMm - jawWidthMm > 10) {
    faceShape = 'heart';
  } else if (jawWidthMm - foreheadWidthMm > 10 && ratio < 1.3) {
    faceShape = 'diamond';
  } else if (ratio > 1.25 && Math.abs(jawWidthMm - foreheadWidthMm) < 10) {
    faceShape = 'oval';
  } else {
    faceShape = 'round';
  }

  const profiles: Record<FaceShape, Omit<FaceShapeAnalysis, 'faceWidthMm' | 'faceHeightMm'>> = {
    oval: {
      faceShape: 'oval',
      recommendedFrameWidthMm: [130, 142],
      recommendedBridgeWidthMm: [16, 19],
      recommendedLensShapes: ['rectangle', 'square', 'aviator'],
      recommendedBrands: ['Ray-Ban', 'Vincent Chase', 'Carrera'],
      framesToAvoid: ['oversized round'],
      reason: 'Balanced proportions suit almost any shape — rectangular and geometric frames add structure.',
    },
    round: {
      faceShape: 'round',
      recommendedFrameWidthMm: [132, 144],
      recommendedBridgeWidthMm: [16, 20],
      recommendedLensShapes: ['square', 'rectangle', 'browline'],
      recommendedBrands: ['Titan', 'Police', 'Oakley'],
      framesToAvoid: ['round', 'small oval'],
      reason: 'Angular frames add definition and contrast the soft curves of a round face.',
    },
    square: {
      faceShape: 'square',
      recommendedFrameWidthMm: [130, 140],
      recommendedBridgeWidthMm: [16, 19],
      recommendedLensShapes: ['round', 'oval', 'cat-eye'],
      recommendedBrands: ['Vincent Chase', 'Fastrack', 'Ray-Ban'],
      framesToAvoid: ['square', 'angular browline'],
      reason: 'Curved frames soften strong jaw and forehead angles for a more balanced look.',
    },
    heart: {
      faceShape: 'heart',
      recommendedFrameWidthMm: [128, 138],
      recommendedBridgeWidthMm: [15, 18],
      recommendedLensShapes: ['round', 'oval', 'rimless'],
      recommendedBrands: ['Lenskart House', 'Titan', 'Carrera'],
      framesToAvoid: ['heavy top browline', 'oversized aviator'],
      reason: 'Lighter, rounded bottoms balance a wider forehead and narrower chin.',
    },
    diamond: {
      faceShape: 'diamond',
      recommendedFrameWidthMm: [130, 140],
      recommendedBridgeWidthMm: [16, 19],
      recommendedLensShapes: ['cat-eye', 'oval', 'browline'],
      recommendedBrands: ['Police', 'Carrera', 'Ray-Ban'],
      framesToAvoid: ['narrow rectangle'],
      reason: 'Frames with detailing at the brow line highlight the eyes and soften prominent cheekbones.',
    },
    rectangle: {
      faceShape: 'rectangle',
      recommendedFrameWidthMm: [132, 142],
      recommendedBridgeWidthMm: [16, 20],
      recommendedLensShapes: ['round', 'square', 'oversized'],
      recommendedBrands: ['Oakley', 'Fastrack', 'Vincent Chase'],
      framesToAvoid: ['narrow rectangle', 'small frames'],
      reason: 'Tall frames with some depth break up the length of an elongated face.',
    },
    triangle: {
      faceShape: 'triangle',
      recommendedFrameWidthMm: [130, 140],
      recommendedBridgeWidthMm: [16, 19],
      recommendedLensShapes: ['cat-eye', 'browline', 'aviator'],
      recommendedBrands: ['Ray-Ban', 'Titan', 'Police'],
      framesToAvoid: ['bottom-heavy frames'],
      reason: 'Frames that are broader up top balance a narrower forehead against a wider jaw.',
    },
  };

  return { ...profiles[faceShape], faceWidthMm, faceHeightMm };
}
