import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true },
    ticketId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['paid', 'manual'], default: 'paid' },
    isValid: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Ticket', ticketSchema);

