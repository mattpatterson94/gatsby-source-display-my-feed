const _ = require(`lodash`)
const crypto = require(`crypto`)
const normalize = require(`./normalize`)

const { apiInstagramPosts } = require(`./instagram`)

const defaultOptions = { type: `account` }

async function getInstagramPosts(options) {
  let data

  if (options.authToken) {
    data = await apiInstagramPosts(options)
  }

  return data
}

function createPostNode(datum, params) {
  return {
    type: params.type,
    username: datum.username,
    id: datum.id,
    parent: `__SOURCE__`,
    internal: {
      type: `InstaNode`,
    },
    children: [],
    caption: datum.caption,
    mediaType: datum.media_type,
    preview: datum.thumbnail_url || datum.media_url,
    original: datum.media_url,
    timestamp: new Date(datum.timestamp).getTime() / 1000,
    permalink: datum.permalink,
    carouselImages: _.get(datum, `children`, []).map((imgObj) => {
      return {
        preview: imgObj.thumbnail_url || imgObj.media_url,
        ...imgObj,
      }
    }),
  }
}

function processDatum(datum, params) {
  const node = createPostNode(datum, params)

  // Get content digest of node. (Required field)
  const contentDigest = crypto
    .createHash(`md5`)
    .update(JSON.stringify(node))
    .digest(`hex`)
  node.internal.contentDigest = contentDigest
  return node
}

exports.sourceNodes = async (
  { actions, store, cache, createNodeId },
  options
) => {
  const { createNode, touchNode } = actions
  const params = { ...defaultOptions, ...options }
  let data

  if (params.type === `account`) {
    data = await getInstagramPosts(params)
  } else {
    console.warn(
      `Unknown type for gatsby-source-display-my-feed: ${params.type}`
    )
  }

  // Process data into nodes.
  if (data) {
    return Promise.all(
      data.map(async (datum) => {
        const res = await normalize.downloadMediaFile({
          datum: processDatum(datum, params),
          store,
          cache,
          createNode,
          createNodeId,
          touchNode,
        })
        createNode(res)
      })
    )
  }
}
