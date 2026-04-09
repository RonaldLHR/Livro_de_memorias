function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Não foi possível processar a imagem: ${file.name}`))
    }

    image.src = objectUrl
  })
}

function canvasToWebpFile(canvas: HTMLCanvasElement, filename: string, quality = 0.86): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao converter imagem para WebP.'))
          return
        }

        resolve(new File([blob], filename, { type: 'image/webp' }))
      },
      'image/webp',
      quality
    )
  })
}

export async function normalizeImageFile(file: File, index: number) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`Arquivo inválido para foto: ${file.name}`)
  }

  const image = await loadImage(file)

  const targetAspect = 4 / 5
  const sourceAspect = image.width / image.height

  let cropWidth = image.width
  let cropHeight = image.height
  let offsetX = 0
  let offsetY = 0

  if (sourceAspect > targetAspect) {
    cropWidth = Math.round(image.height * targetAspect)
    offsetX = Math.round((image.width - cropWidth) / 2)
  } else {
    cropHeight = Math.round(image.width / targetAspect)
    offsetY = Math.round((image.height - cropHeight) / 2)
  }

  const outputWidth = Math.min(1200, cropWidth)
  const outputHeight = Math.round(outputWidth / targetAspect)

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Não foi possível preparar o canvas para imagem.')
  }

  context.drawImage(image, offsetX, offsetY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight)

  return canvasToWebpFile(canvas, `photo-${index + 1}.webp`)
}

export async function normalizeImageFiles(files: File[]) {
  return Promise.all(
    files.map(async (file, index) => {
      try {
        return await normalizeImageFile(file, index)
      } catch {
        if (!file.type.startsWith('image/')) {
          throw new Error(`Arquivo inválido para foto: ${file.name}`)
        }

        return file
      }
    })
  )
}
