<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Client from '@enspirit/seshat-client';
import type { ObjectMeta } from '@enspirit/seshat-client';

export type BrowserProps = {
  prefix?: string
}

const PREFIX_CONTENT_TYPE = 'seshat/prefix';

const client = new Client({
  baseURL: 'http://localhost:3000/s3'
})

const props = withDefaults(defineProps<BrowserProps>(), {
  prefix: '/'
});

const emit = defineEmits<{
  (event: 'update:prefix', prefix: string): void
}>();

const objects = ref<Array<ObjectMeta>>([])
const currentPrefix = ref<string>(props.prefix);

const refresh = async () => {
  objects.value = await client.list(currentPrefix.value);
}

watch(currentPrefix, refresh);

const deleteObject = async (obj: ObjectMeta) => {
  await client.delete(obj.name);
  await refresh();
}

const downloadObject = async (obj: ObjectMeta) => {
  console.log(await client.get(obj.name));
  await refresh();
}

const changePrefix = async (prefix: string) => {
  if (prefix[0] !== '/') {
    prefix = `/${prefix}`;
  }
  if (prefix[prefix.length - 1] !== '/') {
    prefix = `${prefix}/`;
  }
  currentPrefix.value = prefix;
  emit('update:prefix', prefix);
}

const parentPrefix = computed(() => {
  const parts = currentPrefix.value.split('/');

  // pop the trailing slash
  parts.pop();

  if (parts.length === 1) {
    return null;
  }

  // pop the parent prefix
  parts.pop()

  return parts.join('/') + '/';
});

const relativeObjectName = (object: ObjectMeta): string => {
  return object.name.substring(currentPrefix.value.length - 1);
}

const breadCrumbs = computed(() => {
  return currentPrefix.value.split('/').filter(Boolean).reduce((crumbs, part) => {
    const parts = crumbs.map(c => c.name);
    const newCrumb = {
      name: part,
      path: [...parts, part].join('/')
    }
    return [...crumbs, newCrumb];
  }, [] as Array<{
    name: string,
    path: string
  }>);
})

const sortedObjects = computed(() => {
  return objects.value.sort((a, b) => {
    if (a.contentType !== b.contentType) {
      return a.contentType === PREFIX_CONTENT_TYPE ? -1 : 1;
    }

    return a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase() ? -1 : 1;
  })
});

const isFolder = (obj: ObjectMeta): boolean => {
  return obj.contentType === PREFIX_CONTENT_TYPE;
}

refresh();
</script>

<template>
  <div class="seshat-browser">
    <h3>Prefix '{{ currentPrefix }}':</h3>

    <div class="seshat-browser-breadcrumbs">
      <span>
        <a href="#" @click="changePrefix('/')">/</a>
      </span>
      <template v-for="crumb, idx in breadCrumbs">
        <span>
          <a href="#" @click="changePrefix(crumb.path)">{{ crumb.name }}</a>
        </span>
        <span v-if="idx !== breadCrumbs.length - 1">/</span>
      </template>
    </div>
    <div class="seshat-browser-objects">
      <div
        v-if="parentPrefix"
        class="seshat-browser-objects-object">
        <a href="#" @click="changePrefix(parentPrefix)">..</a>
      </div>
      <div
        v-for="obj in sortedObjects" :key="obj.name"
        class="seshat-browser-objects-object" >
        <div class="seshat-browser-objects-object-name">
          <template v-if="isFolder(obj)">
            <a href="#" @click="changePrefix(obj.name)">
              {{ relativeObjectName(obj) }}
            </a>
          </template>
          <template v-else>
            {{ relativeObjectName(obj) }}
          </template>
        </div>
        <div
          v-if="!isFolder(obj)"
          class="seshat-browser-objects-object-actions">
          <button @click="deleteObject(obj)">Delete</button>
          <button @click="downloadObject(obj)">Download</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.seshat-browser {
  display: flex;
  flex-direction: column;
  &-breadcrumbs {
    margin-bottom: 20px;
    span {
      padding-right: 10px;
    }
  }
  &-objects {
    display: flex;
    flex-direction: column;
    display: table;
    &-object {
      padding: 2px;
      display: table-row;
      &:nth-child(odd) {
        background-color: #cecece;
      }
      &:hover {
        background-color: #aeaeae;
      }
      & > * {
        display: table-cell;
      }
    }
  }
}
</style>
