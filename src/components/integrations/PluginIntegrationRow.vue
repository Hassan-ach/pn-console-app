<script setup lang="ts">
import type { PluginActivationStatus, PluginStatus } from '../../api/plugin-manager';

export interface PluginRowItem {
  name: string;
  status: PluginStatus;
  loading: boolean;
  activation?: PluginActivationStatus | null;
}

defineProps<{
  plugin: PluginRowItem;
}>();

const emit = defineEmits<{
  connect: [name: string];
  toggle: [name: string];
  configure: [name: string];
  details: [name: string];
}>();

const pluginIcon: Record<string, string> = {
  telegram:
    'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
};

const statusBadge: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  NOT_CONNECTED: {
    label: 'Not Set Up',
    color: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-300',
  },
  CONNECTED: {
    label: 'Connected',
    color: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-400',
  },
  CONFIGURED: {
    label: 'Idle',
    color: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-400',
  },
  ACTIVATING: {
    label: 'Activating…',
    color: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
  },
  ACTIVE: {
    label: 'Active',
    color: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
  },
  DEACTIVATING: {
    label: 'Deactivating…',
    color: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
  },
  ERROR: {
    label: 'Error',
    color: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <div
          class="w-10 h-10 rounded-full bg-[#FF8C4B]/10 flex items-center justify-center shrink-0"
        >
          <svg
            class="w-5 h-5 text-[#FF8C4B]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              :d="
                pluginIcon[plugin.name] ||
                'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
              "
            />
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 capitalize">
            {{ plugin.name }}
          </h3>
          <span
            class="inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full"
            :class="
              statusBadge[plugin.status]?.color ?? 'bg-gray-100 text-gray-600'
            "
          >
            <span
              class="inline-block w-1.5 h-1.5 rounded-full"
              :class="statusBadge[plugin.status]?.dot ?? 'bg-gray-300'"
            />
            {{ statusBadge[plugin.status]?.label ?? plugin.status }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <template v-if="plugin.status === 'NOT_CONNECTED'">
          <button
            type="button"
            @click="emit('connect', plugin.name)"
            class="px-4 py-2 text-sm font-medium text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] transition-colors cursor-pointer"
          >
            Connect
          </button>
        </template>
        <template
          v-else-if="
            plugin.status === 'ACTIVATING' || plugin.status === 'DEACTIVATING'
          "
        >
          <span
            class="inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"
          />
        </template>
        <template v-else>
          <button
            v-if="plugin.status === 'ACTIVE'"
            type="button"
            :disabled="plugin.loading"
            @click="emit('toggle', plugin.name)"
            class="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Deactivate
          </button>
          <button
            v-else
            type="button"
            :disabled="plugin.loading"
            @click="emit('toggle', plugin.name)"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Activate
          </button>
        </template>

        <!-- Details Icon Button -->
        <button
          v-if="plugin.status !== 'NOT_CONNECTED'"
          type="button"
          @click="emit('details', plugin.name)"
          class="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
          title="View Details & States"
        >
          <svg
            class="w-4.5 h-4.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        <!-- Configure Gear Button -->
        <button
          v-if="plugin.status !== 'NOT_CONNECTED'"
          type="button"
          @click="emit('configure', plugin.name)"
          class="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
          title="Configure"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
