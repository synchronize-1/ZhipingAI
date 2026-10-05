<template>
  <div class="course-interaction">
    <CheckinSection
      v-model:code-dialog-visible="showCodeDialog"
      v-model:qr-dialog-visible="showQRDialog"
      v-model:checkin-code="checkinCode"
      :checkin-status="checkinStatus"
      :checkin-method="checkinMethod"
      :has-checked-in="hasCheckedIn"
      :checkin-time="checkinTime"
      :checkin-stats="checkinStats"
      @checkin="doCheckin"
    />

    <QuestionsSection
      v-model:dialog-visible="showQuestionDialog"
      v-model:form="questionForm"
      :questions="questions"
      @submit="submitQuestion"
      @like="likeQuestion"
    />

    <RatingSection
      v-model:dialog-visible="showRatingDialog"
      v-model:form="ratingForm"
      :ratings="ratings"
      :average-rating="averageRating"
      :available-tags="availableTags"
      :rating-colors="ratingColors"
      @submit="submitRating"
      @toggle-tag="toggleTag"
    />
  </div>
</template>

<script setup>
import { useCourseInteraction } from './useCourseInteraction'
import CheckinSection from './CheckinSection.vue'
import QuestionsSection from './QuestionsSection.vue'
import RatingSection from './RatingSection.vue'

defineProps({
  courseId: {
    type: [String, Number],
    required: true
  },
  courseName: {
    type: String,
    default: ''
  }
})

const {
  showQuestionDialog,
  showRatingDialog,
  showCodeDialog,
  showQRDialog,
  hasCheckedIn,
  checkinTime,
  checkinCode,
  checkinMethod,
  checkinStats,
  checkinStatus,
  doCheckin,
  ratingColors,
  availableTags,
  questionForm,
  ratingForm,
  questions,
  ratings,
  averageRating,
  toggleTag,
  likeQuestion,
  submitQuestion,
  submitRating
} = useCourseInteraction()
</script>

<style scoped>
.course-interaction {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>