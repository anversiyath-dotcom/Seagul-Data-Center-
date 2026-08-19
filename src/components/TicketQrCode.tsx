import React from 'react';

interface TicketQrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export const TicketQrCode: React.FC<TicketQrCodeProps> = ({
  value,
  size = 72,
  className = ''
}) => {
  // Deterministic 25x25 QR pattern based on value hash
  const hash = (str: string) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  };

  const seed = hash(value || '6YUZAW-SEAGULL');
  const gridSize = 25;

  // Generate QR matrix with accurate finder patterns in 3 corners
  const matrix: boolean[][] = Array(gridSize).fill(false).map(() => Array(gridSize).fill(false));

  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  // Top-left finder
  drawFinder(0, 0);
  // Top-right finder
  drawFinder(gridSize - 7, 0);
  // Bottom-left finder
  drawFinder(0, gridSize - 7);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Pseudo-random data bits based on seed and position
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite finders or timing patterns
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !isTiming) {
        const bitSeed = (seed ^ (r * 1103515245 + c * 12345)) % 100;
        matrix[r][c] = bitSeed > 46;
      }
    }
  }

  // Build SVG path data for all dark modules
  let pathData = '';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (matrix[r][c]) {
        pathData += `M${c},${r}h1v1h-1z `;
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${gridSize} ${gridSize}`}
      className={`bg-white p-1 rounded border border-slate-200/80 shadow-2xs ${className}`}
      shapeRendering="crispEdges"
    >
      <rect width={gridSize} height={gridSize} fill="#ffffff" />
      <path d={pathData} fill="#0f172a" />
    </svg>
  );
};
