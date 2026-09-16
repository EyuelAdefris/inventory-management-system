import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET || "default_secret";
  return jwt.sign(payload, secret, { expiresIn: "1d" });
};

export const verifyToken = (token: string) => {
  const secret = process.env.JWT_SECRET || "default_secret";
  return jwt.verify(token, secret);
};
