export const prettierWord = (str) => {
  if (!str) return "";
  
  const words = str.split("_");
  const temp = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  return temp.join(" ");
}

export const getThumbnail = (htmlString) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    const imgElement = tempDiv.querySelector('img');
    const imgUrl = imgElement ? imgElement.src : null;
    return imgUrl;
  }

export const decodeHtmlEntities = (text) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    return doc.documentElement.textContent;
  };


export const getLink = (htmlString, courseTopics) => {
  const s = htmlString
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-") 
    .replace(/-+/g, "-");    

  return `https://wordpress-1494981-5707436.cloudwaysapps.com/courses/${s}/lessons/${courseTopics[0].post_name}`
  
}

export const extractText = (htmlString, className) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;

  const el = tempDiv.querySelector(`.${className}`);
  return el ? el.textContent.trim() : "";
}