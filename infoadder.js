function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function replaceAll(str, arr) {
    for (let i = 0; i < arr.length; i++)
        str = str.replace(new RegExp(escapeRegExp(arr[i][0]), 'g'), arr[i][1]);
    return str;
}
module.exports = (static, userdata) => {
    //Username/profile instead of login buttom
    static = static.replace("</body>", `<script>if (document.cookie) {
    let username = atob(decodeURIComponent(document.cookie.split("=")[1].split(".")[0]))
    let loginbutton = document.getElementById("user")
    loginbutton.href = "/authenticated"
    loginbutton.innerHTML = username+" 😶"
    }</script>
    </body>`)

    //adding Info as needed
    static = replaceAll(static, [
        ["${USERNAME}", userdata.username],
        ["${PHONE}", userdata.phone],
        ["${CARMODEL}", userdata.data.car_model],
        ["${POINTS}", userdata.data.points]
    ])

    return static
}