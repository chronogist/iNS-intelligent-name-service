const fs = require('fs').promises;
const path = require('path');

class JSONStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.domainsFile = path.join(this.dataDir, 'domains.json');
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });

      // Initialize domains file if it doesn't exist
      try {
        await fs.access(this.domainsFile);
      } catch {
        await fs.writeFile(this.domainsFile, JSON.stringify({ domains: {} }, null, 2));
      }

      this.initialized = true;
      console.log('✅ JSON Storage initialized');
    } catch (error) {
      console.error('❌ Failed to initialize storage:', error);
      throw error;
    }
  }

  async readData() {
    await this.initialize();
    const data = await fs.readFile(this.domainsFile, 'utf8');
    return JSON.parse(data);
  }

  async writeData(data) {
    await this.initialize();
    await fs.writeFile(this.domainsFile, JSON.stringify(data, null, 2));
  }

  async saveDomain(domain) {
    const data = await this.readData();
    data.domains[domain.name] = {
      ...domain,
      updatedAt: new Date().toISOString()
    };
    await this.writeData(data);
    return data.domains[domain.name];
  }

  async getDomain(name) {
    const data = await this.readData();
    return data.domains[name] || null;
  }

  async getAllDomains() {
    const data = await this.readData();
    return Object.values(data.domains);
  }

  async updateDomain(name, updates) {
    const data = await this.readData();
    if (!data.domains[name]) {
      throw new Error('Domain not found');
    }
    data.domains[name] = {
      ...data.domains[name],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.writeData(data);
    return data.domains[name];
  }

  async deleteDomain(name) {
    const data = await this.readData();
    delete data.domains[name];
    await this.writeData(data);
  }

  async searchDomains(query) {
    const data = await this.readData();
    const domains = Object.values(data.domains);
    
    if (!query) return domains;
    
    return domains.filter(domain => 
      domain.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

module.exports = new JSONStorage();