import os

file_path = r"c:\Users\Jostin\.gemini\antigravity\playground\vacant-universe\server\routers\conversations.py"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """        driver = WhatsAppService.get_driver(config_dict)
        await driver.send_message(to=client_phone, text=msg.content)"""

new_code = """        driver = WhatsAppService.get_driver(config_dict)
        external_id = await driver.send_message(to=client_phone, text=msg.content)
        if isinstance(external_id, str):
            msg.external_id = external_id
            db.commit()"""

# Replace all occurrences (there are two)
new_content = content.replace(old_code, new_code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Patched {file_path}")
