const imageDownloader = require('image-downloader')
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state')

const googleSearchCredentials = require('../credentials/google-search.json')
async function robot(){
    const content = state.load()

    await fetchImagesOfAllSentences(content)
    await downloadAllImages(content)
    /* const imagesArray = await fetchGoogleAndReturnImagesLinks('Recife')
    console.dir(imagesArray, {depth: null})
    process.exit(0) */
    state.save(content)

    async function fetchImagesOfAllSentences(content){
        for (const sentence of content.sentences){
            const query = `${content.searchTerm} ${sentence.keywords[0]}`
            sentence.images = await fetchGoogleAndReturnImagesLinks(query)

            sentence.googleSearchQuery = query
        }
    }

    async function fetchGoogleAndReturnImagesLinks(query){
        const response = await customSearch.cse.list({
            auth: googleSearchCredentials.apiKey,
            cx: googleSearchCredentials.searchEngineId,
            q: query,
            searchType: 'image',
            num: 2
        })

        const imagesUrl = response.data.items.map((item) => {
            return item.link
        })

        return imagesUrl
    }

    async function downloadAllImages(content){
        content.downloadedImages = []
        content.sentences[1].images[0] = 'https://www.colonialvoyage.com/wordpress/wp-content/uploads/2014/01/Watercolour-chart-of-the-city-of-Recife-Brazil-in-the-17th-century-1665.-Author-Johannes-Vingboons-660x330.jpg'
        for(let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++){
            const images = content.sentences[sentenceIndex].images

            for(let imageIndex = 0; imageIndex < images.length; imageIndex++){
                const imageUrl = images[imageIndex]
                try{
                    if(content.downloadedImages.includes(imageUrl)){
                        throw new Error('Imagem já foi baixada')
                    }
                    await downloadAndSave(imageUrl, `${sentenceIndex}-original.png`)
                    content.downloadedImages.push(imageUrl)
                    console.log(`>[${sentenceIndex}][${imageIndex}] Baixou imagem com sucesso: ${imageUrl}`)
                    break
                } catch(error){
                    console.log(`> Erro ao baixar: (${imageUrl}): ${error}`)
                }
            }
        }
    }

    async function downloadAndSave(url, fileName){
        return imageDownloader.image({
            url, url,
            dest: `./content/${fileName}`
        })
    }

    
}
module.exports = robot