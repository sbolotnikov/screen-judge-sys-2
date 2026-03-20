export function html({ url, host, email }) {
  // Insert invisible space into domains and email address to prevent both the
  // email address and the domain from being turned into a hyperlink by email
  // clients like Outlook and Apple mail, as this is confusing because it seems
  // like they are supposed to click on their email address to sign in.
  const escapedEmail = `${email.replace(/\./g, '&#8203;.')}`;
  const escapedHost = `${host.replace(/\./g, '&#8203;.')}`;

  return `
      <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
      
      <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to ${process.env.SITE_NAME}.</h2>
      
      <h3 style="text-align: center; text-transform: uppercase;">${escapedHost}</h3>
      
      <p>Congratulations! You register with email  <strong>${escapedEmail}</strong>.
      Click on button below.
      
      </p>
      
      <a href=${url} target="_blank" style="background: crimson; text-decoration: none; color: white; padding: 1rem 3rem; margin: 10px 0; display: inline-block;">Sign in with Email</a>
      <p>If button is not working, use following link to enter our site.</p>
      <div>${url}</div>
      </div>
    `;
}

export function text({ url, host }) {
  return `Link to enter ${host}\n${url}\n\n`;
}
export function text_receipt( items, invoice, total) {
  return(
    `Receipt for Invoice #${invoice}\n\n` + items.map((item, index) => {
      return (
        `${item.tag}\n${item.seat !== null && item.table !== null ? `Table: ${item.table < 12 ? item.table + 1 : item.table + 2} Seat: ${item.seat < 12 ? item.seat + 1 : item.seat + 2} Date: ${new Date(item.date).toLocaleDateString('en-us', { month: 'long', day: 'numeric', year: 'numeric', })} ${new Date(item.date).toLocaleTimeString('en-US', { timeStyle: 'short', })}` : ''}\n$${(item.price / item.amount).toFixed(2)}*${item.amount} = $${item.price}\n\n`
      );
    }).join('') + `Total: $${total}`
  );
}
export function html_receipt( items, invoice, total ) {
  return `
  <html lang="en" >
  
<body>
  <div style="width:100%;padding:0.25rem;">
    <div style="width:100%;height:12rem; color:#110c6e;">
      <img src="cid:logo" style="display: block;margin-left: auto;margin-right: auto;" width="100" height="100" alt="Logo" />

      <h2 style="text-align:center;font-weight:700;font-size:1.25rem;line-height:1.75rem;">
        Dance At Le Pari
      </h2>
    </div>
    <h2 style="text-align:center;color:black;">Receipt for Invoice # : ${invoice} </h2>`+
    items.map((item, index) => {
      return `
        <div
          key={${index}}
          style="width:100%;height:250px;display:flex;padding:0.5rem;border-bottom:2px solid #d3d3d3;color:black;"
        >
          <div style=" width: 50%; display:flex;">
            <div style="width: 100%;">
              <p style="width: 100%;font-weight:600;font-size:1.25rem;line-height:1.75rem;text-align:left;">
                ${item.tag}
              </p>
              ${((item.seat !== null) && (item.table !== null))? (
                `<p style="width:100%;font-size:0.875rem;line-height:1.25rem;font-style:italic;text-align:left;">
                  Table:
                  ${item.table < 12 ? item.table + 1 : item.table + 2} Seat:
                  ${item.seat < 12 ? item.seat + 1 : item.seat + 2} Date:
                  ${new Date(item.date).toLocaleDateString('en-us', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })} ${new Date(item.date).toLocaleTimeString('en-US', {
                    timeStyle: 'short',
                  })}
                </p>`
              ):""}
            </div>
          </div>
          <div style="width:49%;display:flex;">
            <p style="width:45%;font-size:1rem;line-height:1.5rem;text-align:center;">
              ${(item.price / item.amount).toFixed(2)}*${item.amount} = $ ${item.price}
            </p>
            ${((item.seat != null) && (item.seat >= 0)) ? (
              `<div style="width:50%;height:100% ">
                  <img
                    src="cid:qrImage${index}"
                    alt="QR Code"
                    style="height:100%;width:auto;max-width:24rem;display: block;margin-left: auto;margin-right: auto;"
                  />
              </div>`
            ) : (
              `<p style="width:250px;height:250px;"></p>`
            )}
          </div>
        </div>
     `}).join('')+
   ` <div style="width:100%;display:flex;color:black;">
      <div style="width:45%;font-size:1rem;line-height:1.5rem;text-align:center;">
        Total
      </div>
      <div style="width:50%;">
       $ ${total}
      </div>
    </div>
    </body>
    </html>
  `
}
