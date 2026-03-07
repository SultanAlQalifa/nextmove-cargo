import os
import re

migrations_dir = 'supabase/migrations'

def replace_auth_uid(m):
    return m.group(0) if m.group(1) else '(select auth.uid())'

def replace_auth_jwt(m):
    return m.group(0) if m.group(1) else '(select auth.jwt())'

def replace_auth_email(m):
    return m.group(0) if m.group(1) else '(select auth.email())'

def replace_auth_role(m):
    return m.group(0) if m.group(1) else '(select auth.role())'

def replace_current_setting_bool(m):
    return m.group(0) if m.group(1) else f"(select {m.group(2)})"

def replace_current_setting(m):
    return m.group(0) if m.group(1) else f"(select {m.group(2)})"

patterns = [
    (re.compile(r'(?i)(\(\s*select\s+)?auth\.uid\(\)'), replace_auth_uid),
    (re.compile(r'(?i)(\(\s*select\s+)?auth\.jwt\(\)'), replace_auth_jwt),
    (re.compile(r'(?i)(\(\s*select\s+)?auth\.email\(\)'), replace_auth_email),
    (re.compile(r'(?i)(\(\s*select\s+)?auth\.role\(\)'), replace_auth_role),
    (re.compile(r'(?i)(\(\s*select\s+)?(current_setting\(\'[^\']+\',\s*(true|false)\))'), replace_current_setting_bool),
    (re.compile(r'(?i)(\(\s*select\s+)?(current_setting\(\'[^\']+\'\))'), replace_current_setting)
]

modified_files = 0

for filename in os.listdir(migrations_dir):
    if not filename.endswith('.sql'):
        continue
    filepath = os.path.join(migrations_dir, filename)
    with open(filepath, 'r') as f:
        original = f.read()
    
    content = original
    for pattern, repl_func in patterns:
        content = pattern.sub(repl_func, content)
        
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        modified_files += 1
        print(f"Updated: {filename}")

print(f"Done! Modified {modified_files} files.")
