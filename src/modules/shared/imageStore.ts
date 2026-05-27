const IMAGE_STORE = new Map<string, string>()
let nextId = 1

export function storeBase64Image(base64DataUrl: string): string {
  for (const [id, data] of IMAGE_STORE) {
    if (data === base64DataUrl) {
      return id
    }
  }

  const id = `img_${nextId++}`
  IMAGE_STORE.set(id, base64DataUrl)
  return id
}

export function getBase64Image(imageId: string): string | undefined {
  return IMAGE_STORE.get(imageId)
}

export function removeBase64Image(imageId: string): void {
  IMAGE_STORE.delete(imageId)
}

export function isImagePlaceholder(url: string): boolean {
  return url.startsWith('image:')
}

export function getPlaceholderId(url: string): string | null {
  if (!isImagePlaceholder(url)) return null
  return url.substring(6)
}

export function createPlaceholderUrl(imageId: string): string {
  return `image:${imageId}`
}

export function textToDisplay(text: string): string {
  return text.replace(
    /!\[([^\]]*)\]\(data:image\/[^)]+\)/g,
    (_match, alt) => `![${alt}](🖼️)`
  )
}

export function textToStorage(text: string): string {
  return text.replace(
    /!\[([^\]]*)\]\(image:([^)]+)\)/g,
    (_match, alt, imageId) => {
      const base64Data = IMAGE_STORE.get(imageId)
      if (base64Data) {
        return `![${alt}](${base64Data})`
      }
      return `![${alt}](${imageId})`
    }
  )
}

export function textFromStorage(text: string): string {
  return text.replace(
    /!\[([^\]]*)\]\(data:image\/[^)]+\)/g,
    (_match, alt, _offset) => {
      const fullMatch = _match
      const dataUrl = fullMatch.match(/!\[([^\]]*)\]\((data:image\/[^)]+)\)/)
      if (dataUrl) {
        const imageId = storeBase64Image(dataUrl[2])
        return `![${alt}](image:${imageId})`
      }
      return _match
    }
  )
}

export function cleanupOrphanedImages(text: string): void {
  const usedIds = new Set<string>()
  const regex = /!\[([^\]]*)\]\(image:([^)]+)\)/g
  let match
  while ((match = regex.exec(text)) !== null) {
    usedIds.add(match[2])
  }

  for (const id of IMAGE_STORE.keys()) {
    if (!usedIds.has(id)) {
      IMAGE_STORE.delete(id)
    }
  }
}
