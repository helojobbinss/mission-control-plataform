/** Cor de semáforo para sinal / bateria / qualidade (0–100). */
export function meterColor(value: number) {
  return value < 30 ? '#ff5263' : value < 70 ? '#fbbf24' : '#10dba4'
}
