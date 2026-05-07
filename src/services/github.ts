interface GithubUser {
    login: string
    name: string
    avatar_url: string
    followers: number
    following: number
    bio: string
    public_repos: number
}

interface GithubStats {
    totalRepos: number
    totalCommits: number
    totalFiles: number
}

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN

const fetchWithAuth = (url: string) => {
    return fetch(url, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`
        }
    })
}

export async function github(username: string): Promise<GithubUser> {
    const response = await fetchWithAuth(`https://api.github.com/users/${username}`)
    if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`)
    }
    return response.json()
}

export async function getGithubStats(username: string): Promise<GithubStats> {
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
                fileCount = tree.tree?.filter((item: any) => item.type === 'blob').length || 0
            }
            
            return { commits: commitCount, files: fileCount }
        } catch {
            return { commits: 0, files: 0 }
        }
    })
    
    const allStats = await Promise.all(statsPromises)
    
    const totalCommits = allStats.reduce((sum, stat) => sum + stat.commits, 0)
    const totalFiles = allStats.reduce((sum, stat) => sum + stat.files, 0)
    
    return { totalRepos: ownRepos.length, totalCommits, totalFiles }
}