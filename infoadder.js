function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
module.exports = (static, userdata) => {
    //Username/profile instead of login buttom
    static = static.replace("</body>", `<script>if (document.cookie) {
    let username = atob(document.cookie.split("=")[1].split(".")[0])
    let loginbutton = document.getElementById("user")
    loginbutton.href = "/authenticated"
    loginbutton.innerHTML = username+" 😶"
    }</script>
    </body>`)

    //adding Info as needed
    static = replaceAll(static, "${USERNAME}", userdata.username)
    static = replaceAll(static, "${PHONE}", userdata.phone)
    static = replaceAll(static, "${CARMODEL}", userdata.data.car_model)
    static = replaceAll(static, "${POINTS}", userdata.data.points)

    return static
}