const Course = require('../models/Course.model');

class CourseService {
  static async getSemesters() {
    return Course.getSemesters();
  }

  static async getTeachers() {
    return Course.getTeacherNames();
  }
}

module.exports = CourseService;