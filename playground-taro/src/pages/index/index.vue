<template>
  <view class="playground">
    123123
    <view class="toolbar">
      <view class="preset-list">
        <view
          v-for="(_, key) in presets"
          :key="key"
          class="preset-btn"
          :class="{ active: activePreset === key }"
          @tap="selectPreset(key)"
        >
          {{ key }}
        </view>
      </view>
    </view>

    <view class="controls">
      <view class="control-row">
        <text class="label">打字效果：</text>
        <switch :checked="smoothEnabled" @change="toggleSmooth" />
      </view>
      <view class="control-row">
        <text class="label">状态：</text>
        <text class="status">{{ statusText }}</text>
      </view>
      <view class="control-row" v-if="smoothEnabled">
        <button class="btn" @tap="handlePauseResume">
          {{ paused ? '继续' : '暂停' }}
        </button>
        <button class="btn" @tap="handleFlush">立即显示</button>
        <button class="btn btn-replay" @tap="handleReplay">重新播放</button>
      </view>
    </view>

    <view class="markdown-area">
      <MarkdownRender
        :content="displayText"
        :final="isFinal"
        @link-click="handleLinkClick"
      />
    </view>
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro'
import { ref, computed, onMounted } from 'vue'
import { MarkdownRender, useSmoothMarkdownStream } from 'taro-markstream/vue'
import { streamContent } from '../../markdown'

const presets = {
  '综合示例': streamContent,
}
const activePreset = ref(Object.keys(presets)[0])
const smoothEnabled = ref(true)
const paused = ref(false)
const isFinal = ref(false)

onMounted(function () {
  selectPreset(activePreset.value)
})

const {
  visible,
  done,
  finish,
  flush,
  reset,
  enqueue,
  pause,
  resume,
} = useSmoothMarkdownStream({
  minCharsPerSecond: 30,
  maxCharsPerSecond: 200,
  targetLatencyMs: 300,
  flushOnFinish: false,
})

const displayText = computed(function () {
  if (smoothEnabled.value) return visible.value
  return presets[activePreset.value] || ''
})

const statusText = computed(function () {
  if (!smoothEnabled.value) return '直接渲染'
  if (done.value) return '已完成'
  if (paused.value) return '已暂停'
  return '流式输出中...'
})

function selectPreset(key) {
  activePreset.value = key
  var content = presets[key] || ''
  if (smoothEnabled.value) {
    reset(content)
    isFinal.value = false
    finish()
  }
}

function toggleSmooth(e) {
  smoothEnabled.value = e.detail.value
  isFinal.value = true
}

function handlePauseResume() {
  if (paused.value) {
    resume()
    paused.value = false
  } else {
    pause()
    paused.value = true
  }
}

function handleFlush() {
  flush()
  isFinal.value = true
}

function handleReplay() {
  var content = presets[activePreset.value] || ''
  reset('')
  isFinal.value = false
  paused.value = false
  if (content) {
    setTimeout(function () { enqueue(content) }, 30)
  }
}

function handleLinkClick(e) {
  if (e.href) {
    Taro.setClipboardData({
      data: e.href,
    })
  }
}
</script>

<style>
.playground {
  padding: 20rpx;
  min-height: 100vh;
}

.toolbar {
  margin-bottom: 16rpx;
}

.preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.preset-btn {
  padding: 8rpx 20rpx;
  background: #fff;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.preset-btn.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.controls {
  background: #fff;
  padding: 16rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.control-row {
  display: flex;
  align-items: center;
  margin: 8rpx 0;
  gap: 12rpx;
}

.label {
  font-size: 26rpx;
  color: #666;
}

.status {
  font-size: 26rpx;
  color: #1890ff;
}

.btn {
  padding: 8rpx 24rpx;
  background: #1890ff;
  color: #fff;
  border-radius: 8rpx;
  font-size: 26rpx;
  margin: 0 8rpx;
}

.btn-replay {
  background: #52c41a;
}

.markdown-area {
  background: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  min-height: 400rpx;
}
</style>