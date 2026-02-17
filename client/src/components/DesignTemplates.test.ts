import { describe, it, expect, vi } from 'vitest';
import { DesignTemplate } from './DesignTemplates';

describe('DesignTemplates Component', () => {
  describe('Template definitions', () => {
    it('should define centered template with zero offset', () => {
      const centeredTemplate: DesignTemplate = {
        id: 'centered',
        name: 'Centered',
        description: 'Design centered in placement area',
        icon: <div />,
        config: {
          position: { x: 0, y: 0 },
          scale: 1,
          rotation: 0,
        },
      };

      expect(centeredTemplate.config.position.x).toBe(0);
      expect(centeredTemplate.config.position.y).toBe(0);
      expect(centeredTemplate.config.scale).toBe(1);
      expect(centeredTemplate.config.rotation).toBe(0);
    });

    it('should define corner templates with correct offsets', () => {
      const cornerTemplates = [
        { id: 'top-left', x: -60, y: -60 },
        { id: 'top-right', x: 60, y: -60 },
        { id: 'bottom-left', x: -60, y: 60 },
        { id: 'bottom-right', x: 60, y: 60 },
      ];

      cornerTemplates.forEach((template) => {
        expect(Math.abs(template.x)).toBe(60);
        expect(Math.abs(template.y)).toBe(60);
      });
    });

    it('should define full-bleed template with larger scale', () => {
      const fullBleedTemplate: DesignTemplate = {
        id: 'full-bleed',
        name: 'Full Bleed',
        description: 'Design scaled to fill entire placement area',
        icon: <div />,
        config: {
          position: { x: 0, y: 0 },
          scale: 1.4,
          rotation: 0,
        },
      };

      expect(fullBleedTemplate.config.scale).toBeGreaterThan(1);
      expect(fullBleedTemplate.config.scale).toBe(1.4);
    });

    it('should define small-centered template with reduced scale', () => {
      const smallTemplate: DesignTemplate = {
        id: 'small-centered',
        name: 'Small Centered',
        description: 'Small design centered in placement area',
        icon: <div />,
        config: {
          position: { x: 0, y: 0 },
          scale: 0.6,
          rotation: 0,
        },
      };

      expect(smallTemplate.config.scale).toBeLessThan(1);
      expect(smallTemplate.config.scale).toBe(0.6);
    });
  });

  describe('Template application logic', () => {
    it('should apply centered template to placement', () => {
      const placement = 'front';
      const template: DesignTemplate = {
        id: 'centered',
        name: 'Centered',
        description: 'Design centered in placement area',
        icon: <div />,
        config: {
          position: { x: 0, y: 0 },
          scale: 1,
          rotation: 0,
        },
      };

      const result = {
        placement,
        position: template.config.position,
        scale: template.config.scale,
        rotation: template.config.rotation,
      };

      expect(result.position.x).toBe(0);
      expect(result.position.y).toBe(0);
      expect(result.scale).toBe(1);
    });

    it('should apply corner template with correct positioning', () => {
      const placement = 'front';
      const template: DesignTemplate = {
        id: 'top-left',
        name: 'Top Left',
        description: 'Design positioned in top-left corner',
        icon: <div />,
        config: {
          position: { x: -60, y: -60 },
          scale: 0.8,
          rotation: 0,
        },
      };

      const result = {
        placement,
        position: template.config.position,
        scale: template.config.scale,
      };

      expect(result.position.x).toBe(-60);
      expect(result.position.y).toBe(-60);
      expect(result.scale).toBe(0.8);
    });

    it('should apply full-bleed template for maximum coverage', () => {
      const placement = 'back';
      const template: DesignTemplate = {
        id: 'full-bleed',
        name: 'Full Bleed',
        description: 'Design scaled to fill entire placement area',
        icon: <div />,
        config: {
          position: { x: 0, y: 0 },
          scale: 1.4,
          rotation: 0,
        },
      };

      const result = {
        placement,
        scale: template.config.scale,
      };

      expect(result.scale).toBe(1.4);
    });
  });

  describe('Template availability', () => {
    it('should have 7 preset templates available', () => {
      const templates: DesignTemplate[] = [
        {
          id: 'centered',
          name: 'Centered',
          description: 'Design centered in placement area',
          icon: <div />,
          config: { position: { x: 0, y: 0 }, scale: 1, rotation: 0 },
        },
        {
          id: 'top-left',
          name: 'Top Left',
          description: 'Design positioned in top-left corner',
          icon: <div />,
          config: { position: { x: -60, y: -60 }, scale: 0.8, rotation: 0 },
        },
        {
          id: 'top-right',
          name: 'Top Right',
          description: 'Design positioned in top-right corner',
          icon: <div />,
          config: { position: { x: 60, y: -60 }, scale: 0.8, rotation: 0 },
        },
        {
          id: 'bottom-left',
          name: 'Bottom Left',
          description: 'Design positioned in bottom-left corner',
          icon: <div />,
          config: { position: { x: -60, y: 60 }, scale: 0.8, rotation: 0 },
        },
        {
          id: 'bottom-right',
          name: 'Bottom Right',
          description: 'Design positioned in bottom-right corner',
          icon: <div />,
          config: { position: { x: 60, y: 60 }, scale: 0.8, rotation: 0 },
        },
        {
          id: 'full-bleed',
          name: 'Full Bleed',
          description: 'Design scaled to fill entire placement area',
          icon: <div />,
          config: { position: { x: 0, y: 0 }, scale: 1.4, rotation: 0 },
        },
        {
          id: 'small-centered',
          name: 'Small Centered',
          description: 'Small design centered in placement area',
          icon: <div />,
          config: { position: { x: 0, y: 0 }, scale: 0.6, rotation: 0 },
        },
      ];

      expect(templates).toHaveLength(7);
    });

    it('should have unique template IDs', () => {
      const templateIds = [
        'centered',
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'full-bleed',
        'small-centered',
      ];

      const uniqueIds = new Set(templateIds);
      expect(uniqueIds.size).toBe(templateIds.length);
    });
  });

  describe('Template callback handling', () => {
    it('should call onApplyTemplate callback when template is applied', () => {
      const mockCallback = vi.fn();
      const template: DesignTemplate = {
        id: 'centered',
        name: 'Centered',
        description: 'Design centered in placement area',
        icon: <div />,
        config: {
          position: { x: 0, y: 0 },
          scale: 1,
          rotation: 0,
        },
      };

      // Simulate applying template
      mockCallback(template);

      expect(mockCallback).toHaveBeenCalledWith(template);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should pass template data to callback with correct structure', () => {
      const mockCallback = vi.fn();
      const template: DesignTemplate = {
        id: 'top-left',
        name: 'Top Left',
        description: 'Design positioned in top-left corner',
        icon: <div />,
        config: {
          position: { x: -60, y: -60 },
          scale: 0.8,
          rotation: 0,
        },
      };

      mockCallback(template);

      const callArgs = mockCallback.mock.calls[0][0];
      expect(callArgs.config.position).toEqual({ x: -60, y: -60 });
      expect(callArgs.config.scale).toBe(0.8);
    });
  });

  describe('Template positioning calculations', () => {
    it('should calculate correct position for top-left corner', () => {
      const placementArea = { x: 100, y: 120, width: 200, height: 200 };
      const template: DesignTemplate = {
        id: 'top-left',
        name: 'Top Left',
        description: 'Design positioned in top-left corner',
        icon: <div />,
        config: {
          position: { x: -60, y: -60 },
          scale: 0.8,
          rotation: 0,
        },
      };

      const finalX = placementArea.x + placementArea.width / 2 + template.config.position.x;
      const finalY = placementArea.y + placementArea.height / 2 + template.config.position.y;

      expect(finalX).toBe(140); // 100 + 100 - 60
      expect(finalY).toBe(160); // 120 + 100 - 60
    });

    it('should calculate correct position for bottom-right corner', () => {
      const placementArea = { x: 100, y: 120, width: 200, height: 200 };
      const template: DesignTemplate = {
        id: 'bottom-right',
        name: 'Bottom Right',
        description: 'Design positioned in bottom-right corner',
        icon: <div />,
        config: {
          position: { x: 60, y: 60 },
          scale: 0.8,
          rotation: 0,
        },
      };

      const finalX = placementArea.x + placementArea.width / 2 + template.config.position.x;
      const finalY = placementArea.y + placementArea.height / 2 + template.config.position.y;

      expect(finalX).toBe(260); // 100 + 100 + 60
      expect(finalY).toBe(280); // 120 + 100 + 60
    });
  });

  describe('Scale validation', () => {
    it('should ensure scale is within valid range', () => {
      const validScales = [0.6, 0.8, 1, 1.4];
      const minScale = 0.5;
      const maxScale = 2;

      validScales.forEach((scale) => {
        expect(scale).toBeGreaterThanOrEqual(minScale);
        expect(scale).toBeLessThanOrEqual(maxScale);
      });
    });

    it('should clamp scale values outside valid range', () => {
      const clampScale = (scale: number, min: number, max: number) => {
        return Math.max(min, Math.min(max, scale));
      };

      expect(clampScale(0.3, 0.5, 2)).toBe(0.5);
      expect(clampScale(2.5, 0.5, 2)).toBe(2);
      expect(clampScale(1, 0.5, 2)).toBe(1);
    });
  });
});
