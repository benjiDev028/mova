const url ="http://192.168.2.13:8001/";



export const CheckEmail = async(email) =>{

    try{
        const response = await fetch(`${url}identity/reset-password-step1`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la vérification de l\'email');
        }

        const data = await response.json();
        return data;
    }catch (error) {
        console.error('Erreur de vérification de l\'email :', error.message);
        throw error;
    }
}

async function CheckCode(email, code) {
    try {
        const response = await fetch(url + "identity/reset-password-step2", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({ email: email, code: code }),
        });

        console.log("Statut HTTP:", response.status);
        
        // PREMIÈRE VÉRIFICATION: Le statut HTTP
        if (!response.ok) {
            console.log("Échec - Statut HTTP non-OK:", response.status);
            return false;
        }

        // DEUXIÈME VÉRIFICATION: Le contenu de la réponse
        const responseText = await response.text();
        console.log("Corps de la réponse:", responseText);
        
        // Vérifier si la réponse est du JSON valide
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Erreur de parsing JSON:", parseError);
            return false;
        }

        // TROISIÈME VÉRIFICATION: Le message dans la réponse
        if (data.message === "Code validé avec succès.") {
            console.log("Succès - Code validé");
            return true;
        } else {
            console.log("Échec - Message:", data.message || "Message non trouvé");
            return false;
        }
        
    } catch (error) {
        console.error("Erreur lors de la vérification du code:", error);
        return false;
    }
}


async function NewPassword(email, new_password) {
    try {
        const response = await fetch(`${url}identity/reset-password-step3`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({ email, new_password }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Error resetting password:", data.detail || data.message);
            return { ok: false, error: data.detail || data.message };
        }

        console.log("Password reset successfully:", data);
        return { ok: true, data };
        
    } catch (error) {
        console.error("Network error during password reset:", error);
        return { ok: false, error: error.message };
    }
}


export default { CheckEmail, CheckCode,NewPassword };