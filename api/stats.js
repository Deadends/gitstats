export default async function handler(req, res) {
    const { username } = req.query
    
    if (!username) {
        return res.status(400).json({ error: 'Username required' })
    }
    
    const GITHUB_TOKEN = process.env.VITE_GITHUB_TOKEN
    
    const fetchWithAuth = (url) => {
        return fetch(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        })
    }
    
    try {
        const reposResponse = await fetchWithAuth(`https://api.github.com/users/${username}/repos?per_page=100`)
        
        if (!reposResponse.ok) {
            throw new Error(`Failed to fetch repos: ${reposResponse.statusText}`)
        }
        
        const repos = await reposResponse.json()
        
        if (!Array.isArray(repos)) {
            throw new Error('Invalid repos response')
        }
        
        const ownRepos = repos.filter(repo => !repo.fork)
        
        const statsPromises = ownRepos.map(async (repo) => {
            try {
                const [commitsResponse, treeResponse] = await Promise.all([
                    fetchWithAuth(`https://api.github.com/repos/${username}/${repo.name}/commits?author=${username}&per_page=1`),
                    fetchWithAuth(`https://api.github.com/repos/${username}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`)
                ])
                
                const commitCount = commitsResponse.ok 
                    ? parseInt(commitsResponse.headers.get('link')?.match(/page=(\d+)>; rel="last"/)?.[1] || '1')
                    : 0
                
                let fileCount = 0
                if (treeResponse.ok) {
                    const tree = await treeResponse.json()
                    fileCount = tree.tree?.filter((item) => item.type === 'blob').length || 0
                }
                
                return { commits: commitCount, files: fileCount }
            } catch {
                return { commits: 0, files: 0 }
            }
        })
        
        const allStats = await Promise.all(statsPromises)
        
        const totalCommits = allStats.reduce((sum, stat) => sum + stat.commits, 0)
        const totalFiles = allStats.reduce((sum, stat) => sum + stat.files, 0)
        
        res.status(200).json({ 
            totalRepos: ownRepos.length, 
            totalCommits, 
            totalFiles 
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
