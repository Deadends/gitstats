export default async function handler(req, res) {
    const { username } = req.query
    
    if (!username) {
        return res.status(400).json({ error: 'Username required' })
    }
    
    try {
        const response = await fetch(`https://api.github.com/users/${username}`, {
            headers: {
                'Authorization': `token ${process.env.VITE_GITHUB_TOKEN}`
            }
        })
        
        if (!response.ok) {
            throw new Error(`Failed to fetch user: ${response.statusText}`)
        }
        
        const data = await response.json()
        res.status(200).json(data)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
