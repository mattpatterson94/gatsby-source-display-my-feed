import { createRemoteFileNode } from "gatsby-source-filesystem"

/**
 * Create file nodes to be used by gatsby image.
 * @param {object} arguments - The good stuff.
 * @returns {number} fileNodeID - Unique identifier.
 */
const createFileNode = async ({
  id,
  preview,
  store,
  cache,
  reporter,
  getNode,
  createNode,
  createNodeId,
  touchNode,
}) => {
  const mediaDataCacheKey = `instagram-media-${id}`
  const cacheMediaData = await cache.get(mediaDataCacheKey)
  let fileNodeID

  if (cacheMediaData) {
    fileNodeID = cacheMediaData.fileNodeID
    touchNode(getNode(fileNodeID))
    return fileNodeID
  }

  try {
    const fileNode = await createRemoteFileNode({
      url: preview,
      store,
      cache,
      createNode,
      createNodeId,
      reporter,
    })

    fileNodeID = fileNode.id

    await cache.set(mediaDataCacheKey, { fileNodeID })
  } catch (error) {
    console.error(`Could not create remote file node, error is: `, error)
  }

  return fileNodeID
}

/**
 * Download media files.
 * @param {object} arguments - The good stuff.
 * @returns {object} datum - Media data.
 */
export async function downloadMediaFile({
  datum,
  store,
  cache,
  createNode,
  getNode,
  reporter,
  createNodeId,
  touchNode,
}) {
  const { carouselImages, id, preview } = datum

  /** Create a file node for base image */
  const fileNodeID = await createFileNode({
    id,
    preview,
    store,
    cache,
    getNode,
    createNode,
    reporter,
    createNodeId,
    touchNode,
  })

  /** eslint-disable-next-line require-atomic-updates */
  if (fileNodeID) datum.localFile___NODE = fileNodeID

  /** If all we have is a single image stop here */
  if (!carouselImages.length) return datum

  /** Loop over all carousel images and create a local file node for each */
  for (let i = 0; i < carouselImages.length; i++) {
    const { id: imgId, preview: imgPreview } = carouselImages[i]

    const carouselFileNodeID = await createFileNode({
      id: imgId,
      preview: imgPreview,
      store,
      cache,
      getNode,
      createNode,
      createNodeId,
      touchNode,
      reporter,
    })

    /** eslint-disable-next-line require-atomic-updates */
    if (carouselFileNodeID)
      datum.carouselImages[i].localFile___NODE = carouselFileNodeID
  }

  return datum
}
