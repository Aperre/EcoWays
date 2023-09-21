module.exports = (static, userdata) => {
    //Username/profile instead of login buttom
    static.replace("</body", `<script>if (document.cookie) {
    let username = atob(document.cookie.split("=")[1].split(".")[0])
    let loginbutton = document.getElementById("user")
    loginbutton.href = "/authenticated"
    loginbutton.innerHTML = username+" 😶"
    }</script>
    </body>`)

    //adding Info as needed
    static.replace("${USERNAME}", userdata.username)
    static.replace("${PHONE}",userdata.phone)
    static.replace("${CARMODEL}",userdata.car_model)

    return static
}