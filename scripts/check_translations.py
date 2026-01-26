import json
import os
import sys

def get_nested_keys(data, prefix=''):
    keys = set()
    for k, v in data.items():
        current_key = f"{prefix}{k}"
        if isinstance(v, dict):
            keys.update(get_nested_keys(v, f"{current_key}."))
        else:
            keys.add(current_key)
    return keys

def main():
    locales_dir = os.path.join('client', 'src', 'locales')
    if not os.path.exists(locales_dir):
        print(f"Error: Locales directory not found at {locales_dir}")
        return

    files = [f for f in os.listdir(locales_dir) if f.endswith('.json')]
    if not files:
        print("No translation files found.")
        return

    localedata = {}
    all_keys = set()

    for f in files:
        with open(os.path.join(locales_dir, f), 'r', encoding='utf-8') as file:
            data = json.load(file)
            localedata[f] = data
            all_keys.update(get_nested_keys(data))

    print(f"Checking {len(files)} locale files: {', '.join(files)}")
    print(f"Found {len(all_keys)} unique translation keys.\n")

    has_drift = False
    for f in files:
        file_keys = get_nested_keys(localedata[f])
        missing = all_keys - file_keys
        extra = file_keys - all_keys # Should logically be empty if all_keys is union

        if missing:
            has_drift = True
            print(f"❌ {f} is missing {len(missing)} keys:")
            for m in sorted(missing):
                print(f"  - {m}")
        else:
            print(f"✅ {f} is complete.")

    if has_drift:
        sys.exit(1)

if __name__ == "__main__":
    main()
