export const normalize = (str) => {
  if (!str) return '';
  
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Supprime les accents
    .replace(/[-'’]/g, " ")            // Remplace tirets et apostrophes par espaces
    .replace(/\s+/g, " ")              // Supprime les espaces multiples
    .trim()                            // Supprime les espaces en début/fin
    .toLowerCase();
};