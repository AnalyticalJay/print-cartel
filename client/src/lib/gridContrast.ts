export interface GridContrastColors {
  lineColor: string;
  axisColor: string;
  markerColor: string;
  washColor: string;
  mode: "light" | "dark";
}

function parseHexColor(color: string): [number, number, number] | null {
  const normalized = color.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(normalized)) return null;

  const expanded = normalized.length === 3
    ? normalized.split("").map((value) => `${value}${value}`).join("")
    : normalized;

  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
  ];
}

function getRelativeLuminance([red, green, blue]: [number, number, number]): number {
  const toLinear = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
}

export function getGridContrastColors(garmentColor?: string): GridContrastColors {
  const rgb = garmentColor ? parseHexColor(garmentColor) : null;
  const luminance = rgb ? getRelativeLuminance(rgb) : 0.5;
  const isLightGarment = luminance >= 0.5;

  return isLightGarment
    ? {
        lineColor: "rgba(15, 23, 42, 0.48)",
        axisColor: "rgba(15, 23, 42, 0.68)",
        markerColor: "#0f172a",
        washColor: "rgba(255, 255, 255, 0.08)",
        mode: "light",
      }
    : {
        lineColor: "rgba(255, 255, 255, 0.72)",
        axisColor: "rgba(255, 255, 255, 0.9)",
        markerColor: "#ffffff",
        washColor: "rgba(15, 23, 42, 0.16)",
        mode: "dark",
      };
}
