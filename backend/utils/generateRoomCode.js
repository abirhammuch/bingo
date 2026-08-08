const characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const generateRoomCode = (length = 6) => {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

export const normalizeRoomCode = (value = "") =>
  value.toString().trim().replace(/[^A-Z0-9]/gi, "").toUpperCase();
