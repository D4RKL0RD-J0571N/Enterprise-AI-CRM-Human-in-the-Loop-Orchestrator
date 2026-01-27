import asyncio
import websockets
import json
import random
import time
import argparse
import statistics

# Configuration
WS_URL = "ws://localhost:8000/ws/chat"
MESSAGES = [
    "Hola, cuánto cuesta el servicio?",
    "Quiero hablar con un humano",
    "Tienen envío a Alajuela?",
    "Necesito un médico urgente",  # Security trigger
    "Venden pizza?",               # Out of Scope
    "Mi pedido no ha llegado",
    "Gracias, muy amables"
]

class StressTester:
    def __init__(self, num_clients, duration, ramp_up):
        self.num_clients = num_clients
        self.duration = duration
        self.ramp_up = ramp_up
        self.stats = {
            "connected": 0,
            "failed_connect": 0,
            "messages_sent": 0,
            "messages_received": 0,
            "errors": 0,
            "latencies": []
        }
        self.running = True

    async def client_task(self, client_id):
        try:
            async with websockets.connect(WS_URL) as websocket:
                self.stats["connected"] += 1
                # print(f"Client {client_id} connected")
                
                while self.running:
                    msg = random.choice(MESSAGES)
                    payload = {
                        "event": "message",
                        "sender": "user",
                        "text": msg,
                        "phone": f"506{random.randint(60000000, 70000000)}"
                    }
                    
                    start_time = time.time()
                    try:
                        # Since the WS is broadcast-only for now in the simple implementation, 
                        # we might not get a direct echo unless we are simulating an Operator or the system broadcasts back.
                        # For this stress test, we just check generic connectivity and broadcast reception.
                        
                        # Note: The current WS implementation broadcasts to ALL connected clients.
                        # So we should receive our own message back or others'.
                        
                        await websocket.recv() # Wait for ANY message (keep alive or broadcast)
                        latency = (time.time() - start_time) * 1000
                        self.stats["latencies"].append(latency)
                        self.stats["messages_received"] += 1
                        
                        # Send a message occasionally
                        if random.random() < 0.2:
                            # We can't actually "send" via this WS endpoint if it's read-only for frontend
                            # Checks: server/routers/websocket.py
                            # If it's read-only, we can only listen. 
                            # If we want to simulate TRAFFIC, we should hit the webhook endpoint HTTP 
                            # and listen on WS for the result.
                            pass

                    except websockets.exceptions.ConnectionClosed:
                        break
                    except Exception as e:
                        self.stats["errors"] += 1
                        break
                        
        except Exception as e:
            self.stats["failed_connect"] += 1
            # print(f"Client {client_id} failed: {e}")

    async def traffic_generator(self):
        """Generates HTTP traffic to trigger WS broadcasts"""
        import aiohttp
        async with aiohttp.ClientSession() as session:
            while self.running:
                msg = random.choice(MESSAGES)
                payload = {
                    "sender": f"506{random.randint(60000000, 70000000)}",
                    "message": msg
                }
                try:
                    start = time.time()
                    async with session.post("http://localhost:8000/whatsapp/webhook", json=payload) as resp:
                        await resp.text()
                        self.stats["messages_sent"] += 1
                    # Sleep to control rate
                    await asyncio.sleep(random.uniform(0.1, 0.5)) 
                except Exception as e:
                    print(f"HTTP Error: {e}")

    async def run(self):
        print(f"🚀 Starting Stress Test: {self.num_clients} WS Listeners | Duration: {self.duration}s")
        
        # Start WS Clients
        tasks = []
        for i in range(self.num_clients):
            tasks.append(asyncio.create_task(self.client_task(i)))
            if self.ramp_up > 0:
                await asyncio.sleep(self.ramp_up / self.num_clients)
        
        # Start Traffic Generator
        traffic_task = asyncio.create_task(self.traffic_generator())
        
        # Run for duration
        await asyncio.sleep(self.duration)
        self.running = False
        
        # Cleanup
        traffic_task.cancel()
        for t in tasks:
            t.cancel()
            
        self.print_report()

    def print_report(self):
        print("\n" + "="*40)
        print("📊 STRESS TEST REPORT")
        print("="*40)
        print(f"Active Listeners: {self.stats['connected']}/{self.num_clients}")
        print(f"Connection Failures: {self.stats['failed_connect']}")
        print(f"Traffic Generated (HTTP): {self.stats['messages_sent']}")
        print(f"Broadcasts Received (WS): {self.stats['messages_received']}")
        
        if self.stats["latencies"]:
            avg_lat = statistics.mean(self.stats["latencies"])
            max_lat = max(self.stats["latencies"])
            p95 = statistics.quantiles(self.stats["latencies"], n=100)[94]
            print(f"Latency (WS Recv): Avg={avg_lat:.2f}ms | Max={max_lat:.2f}ms | P95={p95:.2f}ms")
        else:
            print("Latency: N/A (No messages received)")
            
        print("="*40 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stress Test WhatsApp AI Backend")
    parser.add_argument("--clients", type=int, default=50, help="Number of concurrent WS clients")
    parser.add_argument("--duration", type=int, default=10, help="Test duration in seconds")
    parser.add_argument("--ramp", type=float, default=2.0, help="Ramp up time in seconds")
    
    args = parser.parse_args()
    
    tester = StressTester(args.clients, args.duration, args.ramp)
    try:
        asyncio.run(tester.run())
    except KeyboardInterrupt:
        pass
