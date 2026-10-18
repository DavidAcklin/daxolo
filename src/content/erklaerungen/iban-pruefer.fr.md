Le vérificateur IBAN recalcule les chiffres de contrôle d’un IBAN et décompose les IBAN
suisses et liechtensteinois en leurs éléments. La vérification se déroule entièrement dans
ton navigateur ; le numéro saisi ne quitte pas ton appareil.

### Ce que permet la méthode modulo 97-10

Chaque IBAN porte deux chiffres de contrôle en positions 3 et 4. Ils sont calculés avec la
méthode modulo 97-10 selon ISO/IEC 7064 : le code pays et les chiffres de contrôle passent à
la fin, les lettres sont converties en nombres, et le reste de la division par 97 doit être
égal à 1. La méthode détecte de manière fiable une position erronée isolée, ainsi que la
faute de frappe la plus fréquente : deux chiffres voisins intervertis.

Ce qu’elle ne permet pas : elle n’indique pas **quelle** position est fausse. Le calcul
établit seulement que les chiffres de contrôle et le reste du numéro ne concordent pas —
l’erreur peut tout aussi bien se trouver dans le numéro de compte. C’est pourquoi le message
d’erreur indique les chiffres de contrôle qui correspondraient au numéro de compte saisi, et
te laisse conclure. Elle ne détecte pas non plus toutes les altérations : environ une suite
de chiffres aléatoire sur 97 passe le contrôle par le seul calcul.

### Ce qui distingue un QR-IBAN

Sur le plan formel, l’IBAN et le QR-IBAN ne se distinguent pas ; tous deux suivent la norme
ISO 13616. La différence se trouve en positions 5 à 9, dans l’identification d’établissement
(IID). Si elle est comprise entre 30000 et 31999, il s’agit d’une QR-IID et donc d’un
QR-IBAN. Ces numéros sont réservés au procédé avec référence QR : un QR-IBAN exige une
référence QR, un IBAN conventionnel l’exclut. Confondre les deux produit des factures que
les banques refusent. Un QR-IBAN ne peut en outre être utilisé que pour des entrées de
paiement.

### Pourquoi le compte peut malgré tout ne pas exister

Les chiffres de contrôle relèvent de la pure arithmétique. Ils prouvent que la suite de
chiffres est cohérente en elle-même — pas que la banque existe, que le compte est ouvert,
que le nom correspond au numéro ou qu’un paiement arrivera. Seule la banque qui gère le
compte le sait. Un IBAN formellement correct peut renvoyer à un compte clôturé depuis
longtemps.

Pour les pays autres que la Suisse et le Liechtenstein, nous calculons aussi les chiffres de
contrôle, car la méthode ne dépend pas du pays. Nous n’y vérifions ni la longueur ni la
structure, faute de registre vérifié. Le résultat le dit expressément, au lieu d’affirmer
une certitude qui n’existe pas.

État : 18.10.2026 · Sources : SIX Group, Implementation Guidelines suisses pour QR-facture,
version 2.3, chapitres 2.7 à 2.10 ; SIX Group, Informations techniques sur QR-IID et
QR-IBAN, version 1.1 ; SIX Group, Vérificateur d’IBAN pour la Suisse.
