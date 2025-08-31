import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Try to read the addresses file from the parent directory
    const addressesPath = path.join(process.cwd(), '..', '.ins.addresses.json');
    const addressesData = await readFile(addressesPath, 'utf-8');
    const addresses = JSON.parse(addressesData);
    
    return NextResponse.json(addresses);
  } catch (error) {
    console.warn('Could not load contract addresses:', error);
    
    // Return default addresses for development
    return NextResponse.json({
      registry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      registrar: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      resolver: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      reverse: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      baseNode: '0x0000000000000000000000000000000000000000000000000000000000000000'
    });
  }
}
