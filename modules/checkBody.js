function checkBody(body, keys) {
    let isValid = true;//( valeur de base isVAlid===true)
  
    for (const field of keys) {// la fonction prend deux parametres: body=req.body///keys===champs de saisie:email user etc...
      if (!body[field] || body[field] === '') {

        // si body est undefined ou body==== nulm alors isVAlid devient faux 
        isValid = false;
      }
    }
  
    return isValid;
  }
  
  module.exports = { checkBody };
