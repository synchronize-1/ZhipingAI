<template>
  <div class="learning-resources">
    <ResourceList
      v-model:active-tab="activeTab"
      :resources="filteredResources"
      @open="openResource"
    />

    <AIRecommendationCard />
  </div>
</template>

<script setup>
import { useLearningResources } from './useLearningResources'
import ResourceList from './ResourceList.vue'
import AIRecommendationCard from './AIRecommendationCard.vue'

const { activeTab, filteredResources, openResource } = useLearningResources()
</script>

<style scoped>
.learning-resources {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 24px;
  padding: 28px;
  border: 1px solid #e2e8f0;
}
</style>