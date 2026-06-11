import type { RenderScriptModule } from '@umicat/phaser-sdk';

export interface ObstacleParams extends Record<string, unknown> {
  color?: string;
  shadowColor?: string;
}

export const defaultParams: ObstacleParams = {
  color: '#ff3e3e',
  shadowColor: '#991c1c',
};

export const render: RenderScriptModule<ObstacleParams>['render'] = (g, params) => {
  g.clear();

  const color  = parseInt((params.color       ?? '#ff3e3e').replace(/^#/, ''), 16);
  const shadow = parseInt((params.shadowColor ?? '#991c1c').replace(/^#/, ''), 16);

  // Spike triangle: base sits at y=+20, tip at y=-20, width 40
  // Bottom-left: (-20, 20)  Bottom-right: (20, 20)  Tip: (0, -20)

  // Dark underside shadow
  g.fillStyle(shadow, 1);
  g.fillTriangle(-20, 20, 20, 20, 0, -20);

  // Main spike face (slightly inset)
  g.fillStyle(color, 1);
  g.fillTriangle(-18, 18, 18, 18, 0, -18);

  // Bright left highlight edge
  g.lineStyle(2, 0xff9999, 0.7);
  g.beginPath();
  g.moveTo(-20, 20);
  g.lineTo(0, -20);
  g.strokePath();
};
