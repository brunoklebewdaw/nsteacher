// Armazenamento em memória para os códigos OTP.
// NOTA: Em um ambiente de produção real com múltiplos servidores (serverless functions),
// o ideal é usar um banco de dados como Redis, MongoDB ou Firestore para armazenar esses códigos.
// Para este ambiente, o Map em memória funciona perfeitamente para demonstrar a lógica.

type OtpRecord = {
  code: string;
  expiresAt: number;
};

export const otpStore = new Map<string, OtpRecord>();
