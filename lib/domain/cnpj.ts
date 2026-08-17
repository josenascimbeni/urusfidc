export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCnpj(value: string) {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const calculate = (base: string, weights: number[]) => {
    const total = base.split("").reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = calculate(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calculate(`${digits.slice(0, 12)}${first}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits.endsWith(`${first}${second}`);
}

export function isValidCpf(value: string) {
  const digits = onlyDigits(value); if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  const check = (length: number) => { const total = digits.slice(0, length).split("").reduce((sum, digit, index) => sum + Number(digit) * (length + 1 - index), 0); const remainder = (total * 10) % 11; return remainder === 10 ? 0 : remainder; };
  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
}
