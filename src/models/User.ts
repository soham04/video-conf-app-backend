import mongoose, { Document, Schema } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  photoURL?: string;
  firebaseUid?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    photoURL: {
      type: String,
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });

export const User = mongoose.model<IUserDocument>('User', userSchema);

