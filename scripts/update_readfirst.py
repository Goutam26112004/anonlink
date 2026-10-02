#!/usr/bin/env python3
"""Update readfirst.md with live data passed as arguments."""
import re
import sys

def main():
    readfirst = sys.argv[1]
    timestamp = sys.argv[2]
    landing_status = sys.argv[3]
    api_status = sys.argv[4]
    health_status = sys.argv[5]
    ssl_expiry = sys.argv[6]
    git_head = sys.argv[7]
    vm_uptime = sys.argv[8]
    vm_load = sys.argv[9]
    vm_disk = sys.argv[10]
    vm_mem = sys.argv[11]

    with open(readfirst, 'r') as f:
        content = f.read()

    pairs = [
        (r'> Last updated: .*', f'> Last updated: {timestamp}'),
        (r'\|\s*\*\*Landing page\*\*\s*\|.*', f'| **Landing page** | {landing_status} | `https://anonlink.online` |'),
        (r'\|\s*\*\*API health\*\*\s*\|.*', f'| **API health** | {api_status} | `https://anonlink.online/api/health` |'),
        (r'\|\s*\*\*Root health\*\*\s*\|.*', f'| **Root health** | {health_status} | `https://anonlink.online/health` |'),
        (r'\|\s*\*\*SSL\*\*\s*\|.*', f'| **SSL** | ✅ Valid until {ssl_expiry} |'),
        (r'\|\s*\*\*Local HEAD\*\*\s*\|.*', f'| **Local HEAD** | `{git_head}` |'),
        (r'\|\s*\*\*Uptime\*\*\s*\|.*', f'| **Uptime** | {vm_uptime} |'),
        (r'\|\s*\*\*Load avg\*\*\s*\|.*', f'| **Load avg** | {vm_load} |'),
        (r'\|\s*\*\*Disk\*\*\s*\|.*', f'| **Disk** | {vm_disk} |'),
        (r'\|\s*\*\*RAM\*\*\s*\|.*', f'| **RAM** | {vm_mem} |'),
    ]

    for pattern, replacement in pairs:
        content = re.sub(pattern, replacement, content, count=1)

    with open(readfirst, 'w') as f:
        f.write(content)
    print('readfirst.md updated successfully')

if __name__ == '__main__':
    main()
