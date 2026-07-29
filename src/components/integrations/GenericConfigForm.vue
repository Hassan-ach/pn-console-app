<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ConfigFieldSchema } from '../../api/plugin-manager';

export interface ChatItem {
  id: string;
  name: string;
  historyLimit: number | null;
}

const props = withDefaults(
  defineProps<{
    schema: ConfigFieldSchema[];
    modelValue: Record<string, any>;
    disabled?: boolean;
    pluginName?: string;
  }>(),
  {
    disabled: false,
    pluginName: '',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void;
  (e: 'browse-chats'): void;
}>();

const formData = ref<Record<string, any>>({});

watch(
  () => props.modelValue,
  (val) => {
    formData.value = { ...val };
  },
  { immediate: true, deep: true },
);

function updateField(key: string, val: any) {
  formData.value[key] = val;
  emit('update:modelValue', { ...formData.value });
}

function removeChatItem(fieldKey: string, id: string) {
  const list = Array.isArray(formData.value[fieldKey])
    ? formData.value[fieldKey]
    : [];
  const updated = list.filter((item: ChatItem) => item.id !== id);
  updateField(fieldKey, updated);
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="field in schema" :key="field.key" class="space-y-1.5">
      <!-- Label -->
      <div class="flex items-center justify-between">
        <label
          :for="field.key"
          class="block text-sm font-medium text-gray-700 capitalize"
        >
          {{ field.label || field.key }}
          <span v-if="field.required" class="text-red-500">*</span>
        </label>

        <!-- Optional Browse Button for chats field -->
        <button
          v-if="field.key === 'chats' && pluginName === 'telegram'"
          type="button"
          @click="emit('browse-chats')"
          :disabled="disabled"
          class="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          Browse chats
        </button>
      </div>

      <!-- Helper description -->
      <p v-if="field.description" class="text-xs text-gray-500">
        {{ field.description }}
      </p>

      <!-- Text Input -->
      <input
        v-if="field.type === 'text'"
        :id="field.key"
        type="text"
        :value="formData[field.key] ?? ''"
        @input="
          updateField(
            field.key,
            ($event.target as HTMLInputElement).value,
          )
        "
        :placeholder="field.placeholder"
        :required="field.required"
        :disabled="disabled"
        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/30 focus:border-[#FF8C4B] transition-colors disabled:bg-gray-50 disabled:text-gray-400"
      />

      <!-- Password Input -->
      <input
        v-else-if="field.type === 'password'"
        :id="field.key"
        type="password"
        :value="formData[field.key] ?? ''"
        @input="
          updateField(
            field.key,
            ($event.target as HTMLInputElement).value,
          )
        "
        :placeholder="field.placeholder"
        :required="field.required"
        :disabled="disabled"
        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/30 focus:border-[#FF8C4B] transition-colors disabled:bg-gray-50 disabled:text-gray-400"
      />

      <!-- Number Input -->
      <input
        v-else-if="field.type === 'number'"
        :id="field.key"
        type="number"
        :value="formData[field.key] ?? ''"
        @input="
          updateField(
            field.key,
            ($event.target as HTMLInputElement).value !== ''
              ? Number(($event.target as HTMLInputElement).value)
              : '',
          )
        "
        :placeholder="field.placeholder"
        :required="field.required"
        :disabled="disabled"
        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/30 focus:border-[#FF8C4B] transition-colors disabled:bg-gray-50 disabled:text-gray-400"
      />

      <!-- Boolean Checkbox / Switch -->
      <div v-else-if="field.type === 'boolean'" class="flex items-center gap-2 pt-1">
        <input
          :id="field.key"
          type="checkbox"
          :checked="!!formData[field.key]"
          @change="
            updateField(
              field.key,
              ($event.target as HTMLInputElement).checked,
            )
          "
          :disabled="disabled"
          class="w-4 h-4 text-[#FF8C4B] rounded border-gray-300 focus:ring-[#FF8C4B] cursor-pointer"
        />
        <span class="text-sm text-gray-600">Enable {{ field.label }}</span>
      </div>

      <!-- Select Dropdown -->
      <select
        v-else-if="field.type === 'select'"
        :id="field.key"
        :value="formData[field.key] ?? ''"
        @change="
          updateField(
            field.key,
            ($event.target as HTMLSelectElement).value,
          )
        "
        :disabled="disabled"
        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/30 focus:border-[#FF8C4B] transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-400"
      >
        <option v-if="!field.required" value="">Select option</option>
        <option
          v-for="opt in field.options || []"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>

      <!-- Checkbox List or Chats Array -->
      <div
        v-else-if="field.type === 'checkbox-list' || field.key === 'chats'"
        class="space-y-2 pt-1"
      >
        <div
          v-if="
            Array.isArray(formData[field.key]) &&
            formData[field.key].length > 0
          "
          class="space-y-2 max-h-48 overflow-y-auto pr-1"
        >
          <div
            v-for="chat in formData[field.key]"
            :key="chat.id || chat.name"
            class="flex items-center gap-2 py-2 px-3 rounded-xl border border-gray-200 bg-white"
          >
            <span class="flex-1 text-sm text-gray-700 truncate min-w-0">{{
              chat.name || chat.id
            }}</span>
            <input
              v-if="field.key === 'chats'"
              v-model.number="chat.historyLimit"
              type="number"
              min="0"
              placeholder="Limit"
              :disabled="disabled"
              class="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/30 focus:border-[#FF8C4B] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title="Max messages to extract (empty = all)"
            />
            <button
              type="button"
              @click="removeChatItem(field.key, chat.id)"
              :disabled="disabled"
              class="text-xs text-red-500 hover:text-red-700 cursor-pointer shrink-0 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 py-1">
          No items added yet.
        </p>
      </div>
    </div>
  </div>
</template>
