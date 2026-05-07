export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    const { username } = req.query
    
    if (!username) {
        return res.status(400).json({ error: 'Username required' })
    }
    
    const token = process.env.VITE_GITHUB_TOKEN
    
    if (!token) {
        return res.status(500).json({ error: 'GitHub token not configured' })
    }
    
    try {
        const response = await fetch(`https://api.github.com/users/${username}`, {
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'GitStats-App'
            }
        })
        
        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Failed to fetch user: ${response.statusText} - ${error}`)
        }
        
        const data = await response.json()
        res.status(200).json(data)
    } catch (error) {
        console.error('User API Error:', error)
        res.status(500).json({ error: error.message })
    }
}
