export class BloomFilter {
    private size
    private k
    private bits

    constructor(size : number, k : number) {
      this.size = size;
      this.k = k;
      this.bits = new Array(size).fill(0);
    }   

    hash1(str : string) {
      let hash = 0;
      for (let c of str) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
      return hash;
    }  

    hash2(str : string) {
      let hash = 5381;
      for (let c of str) hash = ((hash << 5) + hash) + c.charCodeAt(0);
      return hash >>> 0;
    }   

    add(str : string) {
      const h1 = this.hash1(str);
      const h2 = this.hash2(str);   
      for (let i = 0; i < this.k; i++) {
        const index = (h1 + i * h2) % this.size;
        this.bits[index] = 1;
      }
    }   

    exists(str : string) {
      const h1 = this.hash1(str);
      const h2 = this.hash2(str);   
      for (let i = 0; i < this.k; i++) {
        const index = (h1 + i * h2) % this.size;    
        if (this.bits[index] === 0) {
          return false;
        }
      } 
      return true;
    }
}