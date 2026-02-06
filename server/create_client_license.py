import sys
from generate_license import generate_license

def main():
    print("--- AI CRM License Generator ---")
    
    business_name = input("Business Name: ").strip()
    plan = input("Plan (starter/pro/enterprise): ").strip().lower() or "pro"
    
    print("\nFeatures (enter 'yes' for each):")
    features = []
    if input("  - WhatsApp? (y/n): ").lower().startswith('y'): features.append("whatsapp")
    if input("  - HITL Review? (y/n): ").lower().startswith('y'): features.append("hitl_review")
    if input("  - Analytics? (y/n): ").lower().startswith('y'): features.append("analytics")
    if input("  - Custom Branding? (y/n): ").lower().startswith('y'): features.append("branding")
    if input("  - Knowledge Base? (y/n): ").lower().startswith('y'): features.append("knowledge_base")
    
    max_seats = int(input("\nMax Seats (number, e.g. 5): ") or 5)
    days_valid = int(input("Days Valid (e.g. 365): ") or 365)
    
    data = {
        "business_name": business_name,
        "plan": plan,
        "features": features,
        "max_seats": max_seats,
        "days_valid": days_valid
    }
    
    try:
        key = generate_license(data)
        print("\n" + "="*50)
        print("GENERATED LICENSE KEY FOR", business_name)
        print("="*50)
        print(key)
        print("="*50)
        print("\nYou can now copy this key and paste it into the Admin Console.")
    except Exception as e:
        print(f"\nError generating license: {e}")

if __name__ == "__main__":
    main()
