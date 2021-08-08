/* eslint-disable camelcase */
const axios = require(`axios`)

export async function apiInstagramPosts({ authToken, maxPosts }) {
  return axios
    .get(
      `https://display-my-feed.herokuapp.com/api/v1/feed.json?token=${authToken}`
    )
    .then(async (response) => {
      const results = []
      results.push(...response.data.media)

      /**
       * If maxPosts option specified, then check if there is a next field in the response data and the results' length <= maxPosts
       * otherwise, fetch as more as it can.
       */
      while (
        maxPosts
          ? response.data.paging.next && results.length <= maxPosts
          : response.data.paging.next
      ) {
        response = await axios(response.data.paging.next)
        results.push(...response.data.data)
      }

      return maxPosts ? results.slice(0, maxPosts) : results
    })
    .catch(async (err) => {
      console.warn(
        `\nCould not get instagram posts using DMF. Error status ${err}`
      )

      return null
    })
}
