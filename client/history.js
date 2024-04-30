const mongoose = require('mongoose');

// Định nghĩa schema cho sự kiện
const eventSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  action: String,
  details: Object
});

// Model cho sự kiện
const Event = mongoose.model('Event', eventSchema);

class History {
  // Hàm tạo sự kiện mới
  static async createEvent(action, details) {
    try {
      const newEvent = new Event({ action, details });
      await newEvent.save();
      return newEvent;
    } catch (error) {
      throw error;
    }
  }

  // Hàm xem tất cả sự kiện
  static async viewEvents() {
    try {
      const events = await Event.find().sort({ timestamp: -1 });
      return events;
    } catch (error) {
      throw error;
    }
  }

  // Hàm xóa sự kiện dựa trên ID
  static async deleteEvent(eventId) {
    try {
      const deletedEvent = await Event.findByIdAndDelete(eventId);
      return deletedEvent;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = History;
