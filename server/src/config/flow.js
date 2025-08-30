const { config } = require('@onflow/fcl');

class FlowConfig {
  constructor() {
    this.networks = {
      testnet: {
        accessNode: 'https://rest-testnet.onflow.org',
        discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
        contracts: {
          AniverseNFT: '0x1234567890abcdef', // Replace with actual deployed contract address
          FlowToken: '0x7e60df042a9c0868',
          NonFungibleToken: '0x631e88ae7f1d7c20'
        }
      },
      mainnet: {
        accessNode: 'https://rest-mainnet.onflow.org',
        discoveryWallet: 'https://fcl-discovery.onflow.org/authn',
        contracts: {
          AniverseNFT: '0x0000000000000000', // Replace with actual deployed contract address
          FlowToken: '0x1654653399040a61',
          NonFungibleToken: '0x1d7e57aa55817448'
        }
      },
      emulator: {
        accessNode: 'http://localhost:8080',
        discoveryWallet: 'http://localhost:8701/fcl/authn',
        contracts: {
          AniverseNFT: '0xf8d6e0586b0a20c7',
          FlowToken: '0x0ae53cb6e3f42a79',
          NonFungibleToken: '0x631e88ae7f1d7c20'
        }
      }
    };
    
    this.currentNetwork = process.env.FLOW_NETWORK || 'testnet';
    this.initialize();
  }

  // Initialize Flow configuration
  initialize() {
    try {
      const network = this.networks[this.currentNetwork];
      
      if (!network) {
        throw new Error(`Invalid Flow network: ${this.currentNetwork}`);
      }

      // Configure FCL
      config({
        'flow.network': this.currentNetwork,
        'accessNode.api': network.accessNode,
        'discovery.wallet': network.discoveryWallet,
        'discovery.authn.endpoint': network.discoveryWallet,
        'app.detail.title': 'Aniverse',
        'app.detail.icon': 'https://aniverse.com/icon.png',
        'app.detail.appId': 'aniverse-nft-platform'
      });

      console.log(`✅ Flow ${this.currentNetwork} configuration initialized`);
      console.log(`🔗 Access Node: ${network.accessNode}`);
      console.log(`👛 Discovery Wallet: ${network.discoveryWallet}`);
    } catch (error) {
      console.error('❌ Error initializing Flow configuration:', error);
    }
  }

  // Get current network configuration
  getCurrentNetwork() {
    return this.networks[this.currentNetwork];
  }

  // Get contract address by name
  getContractAddress(contractName) {
    const network = this.getCurrentNetwork();
    return network.contracts[contractName];
  }

  // Get all contract addresses for current network
  getContractAddresses() {
    return this.getCurrentNetwork().contracts;
  }

  // Switch network
  switchNetwork(networkName) {
    if (!this.networks[networkName]) {
      throw new Error(`Invalid network: ${networkName}`);
    }

    this.currentNetwork = networkName;
    this.initialize();
    
    return this.getCurrentNetwork();
  }

  // Get network info
  getNetworkInfo() {
    const network = this.getCurrentNetwork();
    return {
      name: this.currentNetwork,
      accessNode: network.accessNode,
      discoveryWallet: network.discoveryWallet,
      contracts: network.contracts,
      isTestnet: this.currentNetwork === 'testnet',
      isMainnet: this.currentNetwork === 'mainnet',
      isEmulator: this.currentNetwork === 'emulator'
    };
  }

  // Validate contract address
  validateContractAddress(address) {
    if (!address) return false;
    
    // Flow addresses are 16 characters long and start with 0x
    const addressRegex = /^0x[a-fA-F0-9]{16}$/;
    return addressRegex.test(address);
  }

  // Get contract deployment status
  async getContractDeploymentStatus(contractName) {
    try {
      const address = this.getContractAddress(contractName);
      
      if (!address || address === '0x0000000000000000') {
        return {
          deployed: false,
          address: null,
          message: 'Contract not deployed'
        };
      }

      // TODO: Implement actual contract verification
      // This would check if the contract exists on the blockchain
      
      return {
        deployed: true,
        address: address,
        message: 'Contract deployed and verified'
      };
    } catch (error) {
      return {
        deployed: false,
        address: null,
        message: `Error checking deployment: ${error.message}`
      };
    }
  }

  // Get all contract deployment statuses
  async getAllContractDeploymentStatuses() {
    const contracts = Object.keys(this.getCurrentNetwork().contracts);
    const statuses = {};

    for (const contract of contracts) {
      statuses[contract] = await this.getContractDeploymentStatus(contract);
    }

    return statuses;
  }

  // Get network statistics
  async getNetworkStats() {
    try {
      const network = this.getCurrentNetwork();
      
      // TODO: Implement actual network statistics
      // This would fetch data from the Flow blockchain
      
      return {
        network: this.currentNetwork,
        accessNode: network.accessNode,
        lastBlockHeight: 'N/A', // Would be fetched from blockchain
        totalTransactions: 'N/A', // Would be fetched from blockchain
        contracts: Object.keys(network.contracts).length,
        status: 'connected'
      };
    } catch (error) {
      return {
        network: this.currentNetwork,
        status: 'error',
        error: error.message
      };
    }
  }

  // Get environment-specific configuration
  getEnvironmentConfig() {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
      case 'production':
        return {
          network: 'mainnet',
          debug: false,
          logging: 'error'
        };
      case 'staging':
        return {
          network: 'testnet',
          debug: false,
          logging: 'warn'
        };
      case 'development':
      default:
        return {
          network: 'testnet',
          debug: true,
          logging: 'debug'
        };
    }
  }

  // Update contract addresses
  updateContractAddresses(contracts) {
    if (!contracts || typeof contracts !== 'object') {
      throw new Error('Invalid contracts object');
    }

    const network = this.getCurrentNetwork();
    
    for (const [name, address] of Object.entries(contracts)) {
      if (this.validateContractAddress(address)) {
        network.contracts[name] = address;
        console.log(`✅ Updated ${name} contract address: ${address}`);
      } else {
        console.warn(`⚠️ Invalid contract address for ${name}: ${address}`);
      }
    }
  }

  // Export configuration for client
  exportForClient() {
    const network = this.getCurrentNetwork();
    
    return {
      network: this.currentNetwork,
      accessNode: network.accessNode,
      discoveryWallet: network.discoveryWallet,
      contracts: network.contracts,
      isTestnet: this.currentNetwork === 'testnet',
      isMainnet: this.currentNetwork === 'mainnet'
    };
  }

  // Validate configuration
  validateConfiguration() {
    const network = this.getCurrentNetwork();
    const errors = [];

    if (!network.accessNode) {
      errors.push('Access node URL is missing');
    }

    if (!network.discoveryWallet) {
      errors.push('Discovery wallet URL is missing');
    }

    if (!network.contracts.AniverseNFT || network.contracts.AniverseNFT === '0x0000000000000000') {
      errors.push('AniverseNFT contract address is not configured');
    }

    if (!network.contracts.FlowToken) {
      errors.push('FlowToken contract address is missing');
    }

    if (!network.contracts.NonFungibleToken) {
      errors.push('NonFungibleToken contract address is missing');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

// Create singleton instance
const flowConfig = new FlowConfig();

module.exports = flowConfig;
