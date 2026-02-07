export function should_exclude(message: string, excludes: string[]): boolean {
    for (const pattern of excludes) {
        if (pattern.startsWith("/")) {
            try {
                const last_slash = pattern.lastIndexOf("/")
                const source = last_slash > 0 ? pattern.slice(1, last_slash) : pattern.slice(1)
                const flags = last_slash > 0 ? pattern.slice(last_slash + 1) : ""
                const regex = new RegExp(source, flags)
                if (regex.test(message)) return true
            } catch {
                // invalid regex, skip
            }
        } else {
            if (message.includes(pattern)) return true
        }
    }
    return false
}
