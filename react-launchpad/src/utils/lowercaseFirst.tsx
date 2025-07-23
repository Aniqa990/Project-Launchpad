export function lowercaseFirstLetterKeys(obj: any): any {
    const lowercaseFirst = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);
  
    if (Array.isArray(obj)) {
      return obj.map(lowercaseFirstLetterKeys);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [lowercaseFirst(k), lowercaseFirstLetterKeys(v)])
      );
    }
    return obj;
  }
  