/**
 * Schema mẫu định nghĩa bảng Người Dùng (User)
 */
const UserSchema = {
  id: "String/UUID",
  fullname: "String",
  email: "String (unique)",
  password: "String (hashed)",
  role: "String (user | admin | moderator)",
  avatar: "String (URL)",
  savedPcConfig: {
    cpuId: "String",
    gpuId: "String",
    ramGb: "Number",
    storageGb: "Number",
    os: "String"
  },
  wishlist: ["GameId"],
  createdAt: "Date",
  updatedAt: "Date"
};

module.exports = { UserSchema };
